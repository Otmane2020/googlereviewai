<?php
/**
 * Plugin Name: Google Review AI for WordPress
 * Description: Sync Google Business Profile reviews, generate AI replies with OpenRouter and publish them manually or automatically.
 * Version: 0.1.0
 * Requires at least: 6.2
 * Requires PHP: 8.0
 */
if (!defined('ABSPATH')) exit;

final class GRAI_WP {
    const OPT='grai_settings';
    const CRON='grai_reviews_cron';
    private static $i;
    static function instance(){ return self::$i ?: (self::$i=new self); }
    function __construct(){
        add_filter('cron_schedules',[$this,'schedules']);
        add_action('admin_menu',[$this,'menu']);
        add_action('admin_post_grai_save',[$this,'save']);
        add_action('admin_post_grai_connect',[$this,'connect']);
        add_action('admin_post_grai_callback',[$this,'callback']);
        add_action('admin_post_grai_sync',[$this,'sync_action']);
        add_action('admin_post_grai_generate',[$this,'generate_action']);
        add_action('admin_post_grai_publish',[$this,'publish_action']);
        add_action(self::CRON,[$this,'cron']);
    }
    static function activate(){
        global $wpdb; require_once ABSPATH.'wp-admin/includes/upgrade.php';
        $t=$wpdb->prefix.'grai_reviews'; $c=$wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $t (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            review_id VARCHAR(191) NOT NULL,
            account_id VARCHAR(191) NOT NULL,
            location_id VARCHAR(191) NOT NULL,
            author VARCHAR(255) NULL,
            rating TINYINT UNSIGNED NOT NULL DEFAULT 0,
            comment LONGTEXT NULL,
            review_time DATETIME NULL,
            google_reply LONGTEXT NULL,
            ai_reply LONGTEXT NULL,
            published TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY(id), UNIQUE KEY review_id(review_id)
        ) $c;");
        if(!wp_next_scheduled(self::CRON)) wp_schedule_event(time()+60,'grai_15min',self::CRON);
    }
    static function deactivate(){ $x=wp_next_scheduled(self::CRON); if($x) wp_unschedule_event($x,self::CRON); }
    function schedules($s){ $s['grai_15min']=['interval'=>900,'display'=>'Every 15 minutes']; return $s; }
    function menu(){ add_menu_page('Google Review AI','Review AI','manage_options','grai',[$this,'page'],'dashicons-star-filled',58); }
    function defaults(){ return [
        'google_client_id'=>'','google_client_secret'=>'','google_refresh_token'=>'','google_access_token'=>'','google_access_expires'=>0,
        'account_id'=>'','location_id'=>'','location_name'=>'','locations'=>[],
        'openrouter_key'=>'','language'=>'fr','tone'=>'friendly','signature'=>'','min_rating'=>1,'delay'=>5,'auto_reply'=>0,'auto_publish'=>0,
        'models'=>"deepseek/deepseek-chat-v3.1:free\nmeta-llama/llama-3.3-70b-instruct:free\ngoogle/gemini-2.0-flash-exp:free"
    ]; }
    function s(){ return wp_parse_args(get_option(self::OPT,[]),$this->defaults()); }
    function cfg($k){
        $m=['google_client_id'=>'GRAI_GOOGLE_CLIENT_ID','google_client_secret'=>'GRAI_GOOGLE_CLIENT_SECRET','openrouter_key'=>'GRAI_OPENROUTER_API_KEY'];
        if(isset($m[$k]) && defined($m[$k]) && constant($m[$k])) return constant($m[$k]);
        $s=$this->s(); return $s[$k]??'';
    }
    function au($action,$args=[]){ return add_query_arg(array_merge(['action'=>$action],$args),admin_url('admin-post.php')); }
    function redirect($msg,$err=0){ wp_safe_redirect(add_query_arg(['page'=>'grai','grai_msg'=>$msg,'grai_err'=>$err],admin_url('admin.php'))); exit; }
    function callback_uri(){ return $this->au('grai_callback'); }

    function page(){
        if(!current_user_can('manage_options')) return; $s=$this->s(); global $wpdb; $t=$wpdb->prefix.'grai_reviews';
        $rows=$wpdb->get_results("SELECT * FROM $t ORDER BY COALESCE(review_time,created_at) DESC LIMIT 100");
        if(!empty($_GET['grai_msg'])) echo '<div class="notice '.(!empty($_GET['grai_err'])?'notice-error':'notice-success').' is-dismissible"><p>'.esc_html(wp_unslash($_GET['grai_msg'])).'</p></div>';
        $connect=wp_nonce_url($this->au('grai_connect'),'grai_connect'); $sync=wp_nonce_url($this->au('grai_sync'),'grai_sync');
        ?>
        <style>.grai{max-width:1180px}.grai-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.grai-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px}.grai-kpi{font-size:24px;font-weight:800}.grai-muted{color:#64748b;font-size:13px}.grai-table{width:100%;border-collapse:collapse;background:#fff;margin-top:18px}.grai-table th,.grai-table td{padding:12px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}.grai-reply{background:#f8fafc;padding:9px;border-radius:8px;margin-top:7px}.grai-btn{display:inline-block;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;text-decoration:none;margin:2px}.grai-primary{background:#111827;color:#fff;border-color:#111827}@media(max-width:800px){.grai-grid{grid-template-columns:1fr 1fr}}</style>
        <div class="wrap grai"><h1>Google Review AI</h1><p>WordPress dashboard for Google Business Profile review replies.</p>
        <div class="grai-grid">
          <div class="grai-card"><div class="grai-muted">Google</div><div class="grai-kpi"><?php echo $s['google_refresh_token']?'Connected':'Not connected'; ?></div></div>
          <div class="grai-card"><div class="grai-muted">Location</div><div class="grai-kpi" style="font-size:17px"><?php echo esc_html($s['location_name']?:'—'); ?></div></div>
          <div class="grai-card"><div class="grai-muted">Auto reply</div><div class="grai-kpi"><?php echo $s['auto_reply']?'ON':'OFF'; ?></div></div>
          <div class="grai-card"><div class="grai-muted">Reviews</div><div class="grai-kpi"><?php echo count($rows); ?></div></div>
        </div>
        <h2>Settings</h2><p>Google redirect URI: <code><?php echo esc_html($this->callback_uri()); ?></code></p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>"><input type="hidden" name="action" value="grai_save"><?php wp_nonce_field('grai_save'); ?>
        <table class="form-table">
          <tr><th>Google Client ID</th><td><input class="regular-text" name="google_client_id" value="<?php echo esc_attr($s['google_client_id']); ?>"></td></tr>
          <tr><th>Google Client Secret</th><td><input class="regular-text" type="password" name="google_client_secret" placeholder="Leave blank to keep current"></td></tr>
          <tr><th>OpenRouter API key</th><td><input class="regular-text" type="password" name="openrouter_key" placeholder="Leave blank to keep current"></td></tr>
          <tr><th>Language</th><td><select name="language"><option value="fr" <?php selected($s['language'],'fr'); ?>>French</option><option value="en" <?php selected($s['language'],'en'); ?>>English</option></select></td></tr>
          <tr><th>Tone</th><td><select name="tone"><?php foreach(['friendly','professional','empathetic','warm','casual'] as $v): ?><option <?php selected($s['tone'],$v); ?>><?php echo esc_html($v); ?></option><?php endforeach; ?></select></td></tr>
          <tr><th>Signature</th><td><input class="regular-text" name="signature" value="<?php echo esc_attr($s['signature']); ?>"></td></tr>
          <tr><th>Minimum rating</th><td><input type="number" min="1" max="5" name="min_rating" value="<?php echo intval($s['min_rating']); ?>"></td></tr>
          <tr><th>Reply delay</th><td><input type="number" min="0" max="1440" name="delay" value="<?php echo intval($s['delay']); ?>"> minutes</td></tr>
          <tr><th>Automation</th><td><label><input type="checkbox" name="auto_reply" value="1" <?php checked($s['auto_reply']); ?>> Generate automatically</label><br><label><input type="checkbox" name="auto_publish" value="1" <?php checked($s['auto_publish']); ?>> Publish automatically</label></td></tr>
          <tr><th>OpenRouter models</th><td><textarea class="large-text code" rows="4" name="models"><?php echo esc_textarea($s['models']); ?></textarea></td></tr>
          <?php if($s['locations']): ?><tr><th>Business location</th><td><select name="location_key"><?php foreach($s['locations'] as $l): $k=$l['account'].'|'.$l['location']; ?><option value="<?php echo esc_attr($k); ?>" <?php selected($k,$s['account_id'].'|'.$s['location_id']); ?>><?php echo esc_html($l['title']); ?></option><?php endforeach; ?></select></td></tr><?php endif; ?>
        </table><?php submit_button('Save settings'); ?></form>
        <p><a class="button button-primary" href="<?php echo esc_url($connect); ?>"><?php echo $s['google_refresh_token']?'Reconnect Google':'Connect Google Business Profile'; ?></a> <?php if($s['google_refresh_token']): ?><a class="button" href="<?php echo esc_url($sync); ?>">Sync reviews</a><?php endif; ?></p>
        <h2>Reviews</h2>
        <table class="grai-table"><thead><tr><th>Customer</th><th>Review</th><th>AI reply</th><th>Actions</th></tr></thead><tbody>
        <?php if(!$rows): ?><tr><td colspan="4">No reviews synced yet.</td></tr><?php endif; foreach($rows as $r):
            $g=wp_nonce_url($this->au('grai_generate',['id'=>$r->id]),'grai_generate_'.$r->id); $p=wp_nonce_url($this->au('grai_publish',['id'=>$r->id]),'grai_publish_'.$r->id); ?>
          <tr><td><strong><?php echo esc_html($r->author?:'Google user'); ?></strong><br><?php echo esc_html(str_repeat('★',intval($r->rating))); ?></td><td><?php echo nl2br(esc_html($r->comment?:'No written comment')); ?><?php if($r->google_reply): ?><div class="grai-reply"><b>Google reply</b><br><?php echo nl2br(esc_html($r->google_reply)); ?></div><?php endif; ?></td><td><?php echo $r->ai_reply?'<div class="grai-reply">'.nl2br(esc_html($r->ai_reply)).'</div>':'—'; ?></td><td><a class="grai-btn" href="<?php echo esc_url($g); ?>">Generate</a><?php if($r->ai_reply): ?><a class="grai-btn grai-primary" href="<?php echo esc_url($p); ?>">Publish</a><?php endif; ?></td></tr>
        <?php endforeach; ?></tbody></table></div><?php
    }

    function save(){
        if(!current_user_can('manage_options')) wp_die('Forbidden'); check_admin_referer('grai_save'); $s=$this->s();
        $s['google_client_id']=sanitize_text_field($_POST['google_client_id']??'');
        if(!empty($_POST['google_client_secret'])) $s['google_client_secret']=sanitize_text_field($_POST['google_client_secret']);
        if(!empty($_POST['openrouter_key'])) $s['openrouter_key']=sanitize_text_field($_POST['openrouter_key']);
        $s['language']=($_POST['language']??'fr')==='en'?'en':'fr'; $s['tone']=sanitize_key($_POST['tone']??'friendly'); $s['signature']=sanitize_text_field($_POST['signature']??'');
        $s['min_rating']=max(1,min(5,intval($_POST['min_rating']??1))); $s['delay']=max(0,min(1440,intval($_POST['delay']??5))); $s['auto_reply']=!empty($_POST['auto_reply'])?1:0; $s['auto_publish']=!empty($_POST['auto_publish'])?1:0; $s['models']=sanitize_textarea_field($_POST['models']??$s['models']);
        if(!empty($_POST['location_key']) && strpos($_POST['location_key'],'|')!==false){ [$a,$l]=array_map('sanitize_text_field',explode('|',wp_unslash($_POST['location_key']),2)); $s['account_id']=$a;$s['location_id']=$l; foreach($s['locations'] as $x) if($x['account']===$a&&$x['location']===$l) $s['location_name']=$x['title']; }
        update_option(self::OPT,$s,false); $this->redirect('Settings saved.');
    }
    function connect(){
        if(!current_user_can('manage_options')) wp_die('Forbidden'); check_admin_referer('grai_connect');
        if(!$this->cfg('google_client_id')||!$this->cfg('google_client_secret')) $this->redirect('Add Google Client ID and Client Secret first.',1);
        $state=wp_generate_password(32,false,false); set_transient('grai_oauth_'.hash('sha256',$state),get_current_user_id(),900);
        $q=['client_id'=>$this->cfg('google_client_id'),'redirect_uri'=>$this->callback_uri(),'response_type'=>'code','scope'=>'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email','access_type'=>'offline','prompt'=>'consent','state'=>$state,'include_granted_scopes'=>'true'];
        wp_redirect('https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query($q,'','&',PHP_QUERY_RFC3986)); exit;
    }
    function callback(){
        if(!current_user_can('manage_options')) wp_die('Forbidden'); $state=sanitize_text_field($_GET['state']??''); $key='grai_oauth_'.hash('sha256',$state); $uid=get_transient($key); delete_transient($key);
        if(!$state||intval($uid)!==get_current_user_id()) $this->redirect('Invalid OAuth state.',1); if(!empty($_GET['error'])) $this->redirect('Google authorization cancelled.',1);
        $res=wp_remote_post('https://oauth2.googleapis.com/token',['timeout'=>30,'body'=>['code'=>sanitize_text_field($_GET['code']??''),'client_id'=>$this->cfg('google_client_id'),'client_secret'=>$this->cfg('google_client_secret'),'redirect_uri'=>$this->callback_uri(),'grant_type'=>'authorization_code']]);
        if(is_wp_error($res)) $this->redirect($res->get_error_message(),1); $d=json_decode(wp_remote_retrieve_body($res),true); if(empty($d['access_token'])) $this->redirect('Google token exchange failed: '.($d['error_description']??'unknown error'),1);
        $s=$this->s(); $s['google_access_token']=$d['access_token'];$s['google_access_expires']=time()+intval($d['expires_in']??3600)-60;if(!empty($d['refresh_token']))$s['google_refresh_token']=$d['refresh_token'];update_option(self::OPT,$s,false);
        $loc=$this->discover(); if(is_wp_error($loc)) $this->redirect('Google connected but location discovery failed: '.$loc->get_error_message(),1); $this->redirect('Google Business Profile connected.');
    }
    function token(){
        $s=$this->s(); if($s['google_access_token']&&intval($s['google_access_expires'])>time()+30)return $s['google_access_token']; if(!$s['google_refresh_token'])return new WP_Error('no_token','Google is not connected.');
        $r=wp_remote_post('https://oauth2.googleapis.com/token',['timeout'=>30,'body'=>['client_id'=>$this->cfg('google_client_id'),'client_secret'=>$this->cfg('google_client_secret'),'refresh_token'=>$s['google_refresh_token'],'grant_type'=>'refresh_token']]); if(is_wp_error($r))return $r;
        $d=json_decode(wp_remote_retrieve_body($r),true); if(empty($d['access_token']))return new WP_Error('refresh','Could not refresh Google token.'); $s['google_access_token']=$d['access_token'];$s['google_access_expires']=time()+intval($d['expires_in']??3600)-60;update_option(self::OPT,$s,false);return $s['google_access_token'];
    }
    function google($method,$url,$body=null){
        $tok=$this->token(); if(is_wp_error($tok))return $tok; $a=['method'=>$method,'timeout'=>40,'headers'=>['Authorization'=>'Bearer '.$tok,'Content-Type'=>'application/json']]; if($body!==null)$a['body']=wp_json_encode($body); $r=wp_remote_request($url,$a); if(is_wp_error($r))return $r; $code=wp_remote_retrieve_response_code($r); $d=json_decode(wp_remote_retrieve_body($r),true); if($code>=300)return new WP_Error('google_'.$code,$d['error']['message']??('Google API error '.$code)); return $d?:[];
    }
    function discover(){
        $a=$this->google('GET','https://mybusinessaccountmanagement.googleapis.com/v1/accounts'); if(is_wp_error($a))return $a; $out=[];
        foreach(($a['accounts']??[]) as $acc){ $name=$acc['name']??''; if(!$name)continue; $l=$this->google('GET','https://mybusinessbusinessinformation.googleapis.com/v1/'.$name.'/locations?readMask=name,title,storeCode&pageSize=100'); if(is_wp_error($l))continue; foreach(($l['locations']??[]) as $x){ $id=preg_replace('#^locations/#','',$x['name']??''); if($id)$out[]=['account'=>preg_replace('#^accounts/#','',$name),'location'=>$id,'title'=>$x['title']??$id]; } }
        if(!$out)return new WP_Error('no_locations','No accessible Business Profile location found.'); $s=$this->s();$s['locations']=$out;if(!$s['location_id']){$s['account_id']=$out[0]['account'];$s['location_id']=$out[0]['location'];$s['location_name']=$out[0]['title'];}update_option(self::OPT,$s,false);return $out;
    }
    function sync_action(){ if(!current_user_can('manage_options'))wp_die('Forbidden');check_admin_referer('grai_sync');$x=$this->sync_reviews();$this->redirect(is_wp_error($x)?$x->get_error_message():($x.' reviews synchronized.'),is_wp_error($x)); }
    function sync_reviews(){
        global $wpdb;$s=$this->s();if(!$s['account_id']||!$s['location_id'])return new WP_Error('location','Choose a Google location first.');$d=$this->google('GET','https://mybusiness.googleapis.com/v4/accounts/'.rawurlencode($s['account_id']).'/locations/'.rawurlencode($s['location_id']).'/reviews?pageSize=50&orderBy=updateTime%20desc');if(is_wp_error($d))return $d;
        $t=$wpdb->prefix.'grai_reviews';$map=['ONE'=>1,'TWO'=>2,'THREE'=>3,'FOUR'=>4,'FIVE'=>5];$n=0;foreach(($d['reviews']??[]) as $r){$rid=$r['reviewId']??'';if(!$rid)continue;$row=['account_id'=>$s['account_id'],'location_id'=>$s['location_id'],'author'=>$r['reviewer']['displayName']??'Google user','rating'=>$map[$r['starRating']??'']??intval($r['starRating']??0),'comment'=>$r['comment']??'','review_time'=>!empty($r['createTime'])?gmdate('Y-m-d H:i:s',strtotime($r['createTime'])):null,'google_reply'=>$r['reviewReply']['comment']??null,'published'=>!empty($r['reviewReply']['comment'])?1:0,'updated_at'=>current_time('mysql',true)];$id=$wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE review_id=%s",$rid));if($id)$wpdb->update($t,$row,['id'=>$id]);else{$row['review_id']=$rid;$row['created_at']=current_time('mysql',true);$wpdb->insert($t,$row);} $n++;}return $n;
    }
    function generate_action(){ if(!current_user_can('manage_options'))wp_die('Forbidden');$id=intval($_GET['id']??0);check_admin_referer('grai_generate_'.$id);$x=$this->generate($id);$this->redirect(is_wp_error($x)?$x->get_error_message():'AI reply generated.',is_wp_error($x)); }
    function generate($id){
        global $wpdb;$t=$wpdb->prefix.'grai_reviews';$r=$wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id=%d",$id));if(!$r)return new WP_Error('review','Review not found.');$key=$this->cfg('openrouter_key');if(!$key)return new WP_Error('openrouter','Add your OpenRouter API key.');$s=$this->s();$lang=$s['language']==='en'?'English':'French';$sys="Write a natural Google review response in $lang. Tone: {$s['tone']}. Address the specific feedback, never invent facts, keep it 2 to 5 sentences.";if($s['signature'])$sys.=' End with exactly: '.$s['signature'];$user='Rating '.$r->rating.'/5. Customer '.$r->author.'. Review: '.($r->comment?:'No written comment');$models=array_filter(array_map('trim',preg_split('/\R/',$s['models'])));$last='No AI model succeeded.';
        foreach($models as $m){$res=wp_remote_post('https://openrouter.ai/api/v1/chat/completions',['timeout'=>50,'headers'=>['Authorization'=>'Bearer '.$key,'Content-Type'=>'application/json','HTTP-Referer'=>home_url('/'),'X-Title'=>'Google Review AI WordPress'],'body'=>wp_json_encode(['model'=>$m,'messages'=>[['role'=>'system','content'=>$sys],['role'=>'user','content'=>$user]],'temperature'=>0.7,'max_tokens'=>500])]);if(is_wp_error($res)){$last=$res->get_error_message();continue;}$code=wp_remote_retrieve_response_code($res);$d=json_decode(wp_remote_retrieve_body($res),true);$txt=trim($d['choices'][0]['message']['content']??'');if($code<300&&$txt){$wpdb->update($t,['ai_reply'=>wp_strip_all_tags($txt),'updated_at'=>current_time('mysql',true)],['id'=>$id]);return $txt;}$last=$d['error']['message']??('OpenRouter error '.$code);if(!in_array($code,[402,404,429],true)&&$code<500)break;}return new WP_Error('ai',$last);
    }
    function publish_action(){ if(!current_user_can('manage_options'))wp_die('Forbidden');$id=intval($_GET['id']??0);check_admin_referer('grai_publish_'.$id);$x=$this->publish($id);$this->redirect(is_wp_error($x)?$x->get_error_message():'Reply published to Google.',is_wp_error($x)); }
    function publish($id){
        global $wpdb;$t=$wpdb->prefix.'grai_reviews';$r=$wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id=%d",$id));if(!$r||!$r->ai_reply)return new WP_Error('publish','Generate an AI reply first.');$u='https://mybusiness.googleapis.com/v4/accounts/'.rawurlencode($r->account_id).'/locations/'.rawurlencode($r->location_id).'/reviews/'.rawurlencode($r->review_id).'/reply';$x=$this->google('PUT',$u,['comment'=>$r->ai_reply]);if(is_wp_error($x))return $x;$wpdb->update($t,['google_reply'=>$r->ai_reply,'published'=>1,'updated_at'=>current_time('mysql',true)],['id'=>$id]);return true;
    }
    function cron(){
        $s=$this->s();if(!$s['google_refresh_token'])return;$this->sync_reviews();if(!$s['auto_reply'])return;global $wpdb;$t=$wpdb->prefix.'grai_reviews';$cut=gmdate('Y-m-d H:i:s',time()-intval($s['delay'])*60);$rows=$wpdb->get_results($wpdb->prepare("SELECT id FROM $t WHERE (google_reply IS NULL OR google_reply='') AND (ai_reply IS NULL OR ai_reply='') AND rating >= %d AND created_at <= %s ORDER BY created_at ASC LIMIT 5",intval($s['min_rating']),$cut));foreach($rows as $r){$g=$this->generate($r->id);if(!is_wp_error($g)&&$s['auto_publish'])$this->publish($r->id);}
    }
}
GRAI_WP::instance();
register_activation_hook(__FILE__,['GRAI_WP','activate']);
register_deactivation_hook(__FILE__,['GRAI_WP','deactivate']);
